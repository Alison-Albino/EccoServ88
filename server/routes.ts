import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertVisitSchema, createInvoiceSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, userType } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password || user.userType !== userType) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const userWithProfile = await storage.getUserWithProfile(user.id);
      res.json({ user: userWithProfile });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user profile
  app.get("/api/auth/profile/:userId", async (req, res) => {
    try {
      const userWithProfile = await storage.getUserWithProfile(req.params.userId);
      if (!userWithProfile) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: userWithProfile });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Client routes
  app.get("/api/clients/:clientId/wells", async (req, res) => {
    try {
      const wells = await storage.getWellsByClientId(req.params.clientId);
      res.json({ wells });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/clients/:clientId/visits", async (req, res) => {
    try {
      const visits = await storage.getVisitsByClientId(req.params.clientId);
      res.json({ visits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Provider routes
  app.get("/api/providers/:providerId/visits", async (req, res) => {
    try {
      const provider = await storage.getProvider(req.params.providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const visits = await storage.getVisitsByProviderId(req.params.providerId);
      const allVisitsWithDetails = await storage.getVisitsWithDetails();
      const providerVisitsWithDetails = allVisitsWithDetails.filter(
        visit => visit.providerId === req.params.providerId
      );

      res.json({ visits: providerVisitsWithDetails });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits", upload.array('photos', 10), async (req, res) => {
    try {
      const visitData = insertVisitSchema.parse({
        ...req.body,
        visitDate: new Date(req.body.visitDate),
        photos: req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : []
      });

      const visit = await storage.createVisit(visitData);
      res.status(201).json({ visit });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      const providers = await storage.getAllProviders();
      const wells = await storage.getWellsWithClient();
      const visits = await storage.getVisitsWithDetails();

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyVisits = visits.filter(visit => {
        const visitDate = new Date(visit.visitDate);
        return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear;
      });

      res.json({
        totalClients: clients.length,
        totalProviders: providers.length,
        totalWells: wells.length,
        monthlyVisits: monthlyVisits.length
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json({ clients });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/providers", async (req, res) => {
    try {
      const providers = await storage.getAllProviders();
      res.json({ providers });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/wells", async (req, res) => {
    try {
      const wells = await storage.getWellsWithClient();
      res.json({ wells });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/visits", async (req, res) => {
    try {
      const visits = await storage.getVisitsWithDetails();
      res.json({ visits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all clients and wells for dropdowns
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json({ clients });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/wells", async (req, res) => {
    try {
      const wells = await storage.getWellsWithClient();
      res.json({ wells });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice routes
  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = createInvoiceSchema.parse(req.body);
      
      // Get visit details to populate client and provider
      const visit = await storage.getVisit(invoiceData.visitId);
      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      const well = await storage.getWell(visit.wellId);
      if (!well) {
        return res.status(404).json({ message: "Well not found" });
      }

      // Calculate total amount
      const serviceValue = parseFloat(invoiceData.serviceValue);
      const materialCosts = parseFloat(invoiceData.materialCosts || '0.00');
      const totalAmount = (serviceValue + materialCosts).toFixed(2);

      const invoice = await storage.createInvoice({
        visitId: invoiceData.visitId,
        clientId: well.clientId,
        providerId: visit.providerId,
        description: invoiceData.description,
        serviceValue: invoiceData.serviceValue,
        materialCosts: invoiceData.materialCosts || '0.00',
        totalAmount,
        isFree: invoiceData.isFree || serviceValue === 0,
        status: 'pending',
        dueDate: new Date(invoiceData.dueDate),
        paymentMethod: invoiceData.paymentMethod || null,
        notes: invoiceData.notes || null,
        paymentUrl: null,
        paidDate: null
      });

      res.status(201).json({ invoice });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoicesWithDetails();
      res.json({ invoices });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/clients/:clientId/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByClientId(req.params.clientId);
      res.json({ invoices });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/providers/:providerId/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByProviderId(req.params.providerId);
      res.json({ invoices });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/invoices/:id/send", async (req, res) => {
    try {
      await storage.markInvoiceAsSent(req.params.id);
      const invoice = await storage.getInvoice(req.params.id);
      res.json({ invoice, message: "Invoice sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/invoices/:id/paid", async (req, res) => {
    try {
      const { paymentMethod } = req.body;
      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }
      
      await storage.markInvoiceAsPaid(req.params.id, paymentMethod);
      const invoice = await storage.getInvoice(req.params.id);
      res.json({ invoice, message: "Invoice marked as paid" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/invoices/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      await storage.updateInvoiceStatus(req.params.id, status);
      const invoice = await storage.getInvoice(req.params.id);
      res.json({ invoice, message: "Invoice status updated" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
