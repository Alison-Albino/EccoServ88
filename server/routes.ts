import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-simple";
import { loginSchema, insertVisitSchema, createInvoiceSchema, insertMaterialUsageSchema, insertWaterQualityParameterSchema, AVAILABLE_MATERIALS, WATER_PARAMETERS, WATER_STATUS_OPTIONS } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

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
  // Registration
  app.post('/api/register', async (req, res) => {
    try {
      const { name, email, password, userType } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Usuário já existe com este email' });
      }

      // Create user
      const user = await storage.createUser({
        name,
        email,
        password, // In production, hash the password
        userType
      });

      res.json({ id: user.id, name: user.name, email: user.email, userType: user.userType });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

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

  // Create client profile
  app.post("/api/clients", async (req, res) => {
    try {
      const { userId, address, phone } = req.body;
      
      const client = await storage.createClient({
        userId,
        address,
        phone
      });

      res.status(201).json(client);
    } catch (error) {
      console.error('Create client error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Create provider profile
  app.post("/api/providers", async (req, res) => {
    try {
      const { userId, specialties, phone } = req.body;
      
      const provider = await storage.createProvider({
        userId,
        specialties,
        phone
      });

      res.status(201).json(provider);
    } catch (error) {
      console.error('Create provider error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
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

  app.get("/api/providers/:providerId/visits-with-materials", async (req, res) => {
    try {
      const provider = await storage.getProvider(req.params.providerId);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const visits = await storage.getVisitsByProviderId(req.params.providerId);
      const visitsWithMaterials = [];
      
      for (const visit of visits) {
        const visitWithMaterials = await storage.getVisitWithMaterials(visit.id);
        if (visitWithMaterials) {
          visitsWithMaterials.push(visitWithMaterials);
        }
      }

      res.json({ visits: visitsWithMaterials });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits", upload.array('photos', 10), async (req, res) => {
    try {
      console.log('Received visit data:', req.body);
      
      const visitData = {
        wellId: req.body.wellId,
        providerId: req.body.providerId,
        visitDate: new Date(req.body.visitDate),
        serviceType: req.body.serviceType,
        visitType: req.body.visitType,
        nextVisitDate: req.body.nextVisitDate ? new Date(req.body.nextVisitDate) : null,
        observations: req.body.observations || '',
        status: req.body.status || 'completed',
        photos: req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : []
      };
      
      console.log('Processed visit data:', visitData);
      
      const parsedData = insertVisitSchema.parse(visitData);

      const visit = await storage.createVisit(parsedData);

      // Handle materials if provided
      if (req.body.materials) {
        try {
          const materials = JSON.parse(req.body.materials);
          for (const material of materials) {
            await storage.createMaterialUsage({
              visitId: visit.id,
              materialType: material.type,
              quantityGrams: material.quantity,
              notes: null
            });
          }
        } catch (materialError) {
          console.error("Error saving materials:", materialError);
        }
      }

      // Handle water quality parameters if provided
      if (req.body.waterParameters) {
        try {
          const waterParameters = JSON.parse(req.body.waterParameters);
          for (const param of waterParameters) {
            await storage.createWaterQualityParameter({
              visitId: visit.id,
              parameter: param.parameter,
              value: param.value,
              unit: param.unit,
              status: param.status,
              notes: param.notes || null
            });
          }
        } catch (parameterError) {
          console.error("Error saving water parameters:", parameterError);
        }
      }

      // If it's a periodic visit and nextVisitDate is provided, create a scheduled visit
      if (visitData.visitType === 'periodic' && visitData.nextVisitDate) {
        await storage.createScheduledVisit({
          wellId: visitData.wellId,
          providerId: visitData.providerId,
          scheduledDate: visitData.nextVisitDate,
          serviceType: visitData.serviceType,
          status: 'scheduled',
          notes: `Agendamento automático gerado pela visita ${visit.id}`,
          createdFromVisitId: visit.id
        });
        console.log('Agendamento automático criado para:', visitData.nextVisitDate);
      }

      res.status(201).json({ visit });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Scheduled visits routes
  app.get("/api/scheduled-visits", async (req, res) => {
    try {
      const scheduledVisits = await storage.getScheduledVisitsWithDetails();
      res.json({ scheduledVisits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/providers/:providerId/scheduled-visits", async (req, res) => {
    try {
      const allScheduledVisits = await storage.getScheduledVisitsWithDetails();
      const providerScheduledVisits = allScheduledVisits.filter(
        visit => visit.providerId === req.params.providerId
      );
      res.json({ scheduledVisits: providerScheduledVisits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/clients/:clientId/scheduled-visits", async (req, res) => {
    try {
      const scheduledVisits = await storage.getScheduledVisitsByClientId(req.params.clientId);
      res.json({ scheduledVisits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/scheduled-visits/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateScheduledVisitStatus(req.params.id, status);
      res.json({ message: "Status atualizado com sucesso" });
    } catch (error) {
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
        invoiceNumber: `FAT-${Date.now()}`,
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

  // Material usage routes
  app.get("/api/materials", async (req, res) => {
    try {
      res.json({ materials: AVAILABLE_MATERIALS });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/water-parameters", async (req, res) => {
    try {
      res.json({ 
        parameters: WATER_PARAMETERS,
        statusOptions: WATER_STATUS_OPTIONS
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits/:visitId/materials", async (req, res) => {
    try {
      const { visitId } = req.params;
      const { materials } = req.body;

      if (!materials || !Array.isArray(materials)) {
        return res.status(400).json({ message: "Materials array is required" });
      }

      const createdMaterials = [];
      for (const material of materials) {
        if (material.selected && material.quantity > 0) {
          const materialUsage = await storage.createMaterialUsage({
            visitId,
            materialType: material.type,
            quantityGrams: material.quantity.toString(),
            notes: material.notes || null
          });
          createdMaterials.push(materialUsage);
        }
      }

      res.status(201).json({ materials: createdMaterials });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/visits/:visitId/materials", async (req, res) => {
    try {
      const materials = await storage.getMaterialUsageByVisitId(req.params.visitId);
      res.json({ materials });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/materials/consumption", async (req, res) => {
    try {
      const { period } = req.query;
      let startDate: Date;
      let endDate = new Date();

      if (period === 'week') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        return res.status(400).json({ message: "Period must be 'week' or 'month'" });
      }

      const consumption = await storage.getMaterialConsumptionByPeriod(startDate, endDate);
      
      // Convert to kg and format response
      const formattedConsumption = consumption.map(item => ({
        materialType: item.materialType,
        totalGrams: item.totalGrams,
        totalKilograms: Number((item.totalGrams / 1000).toFixed(3))
      }));

      res.json({ 
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        consumption: formattedConsumption 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
