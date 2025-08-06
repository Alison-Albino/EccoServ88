import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-simple";
import { loginSchema, insertVisitSchema, createInvoiceSchema, insertMaterialUsageSchema, insertWaterQualityParameterSchema, AVAILABLE_MATERIALS, WATER_PARAMETERS, WATER_STATUS_OPTIONS } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import express from "express";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      // Preservar nome original com timestamp para evitar conflitos
      const timestamp = Date.now();
      const originalName = file.originalname;
      const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${timestamp}_${safeName}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' || 
        file.mimetype.includes('document') ||
        file.mimetype.includes('word')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Create fields for multiple types of uploads
const uploadFields = upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'documents', maxCount: 5 }
]);

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

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

  // Get current authenticated user (from localStorage)
  app.get("/api/auth/user", async (req, res) => {
    try {
      // In a real implementation, this would use session/token auth
      // For now, we expect the client to send user data or we return null
      res.json(null);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create client profile
  app.post("/api/clients", async (req, res) => {
    try {
      const { name, cpf, email, address, phone, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Usuário já existe com este email' });
      }

      // Create user first
      const user = await storage.createUser({
        name,
        email,
        password: password || "123456", // Default password
        userType: "client"
      });

      // Then create client profile
      const client = await storage.createClient({
        userId: user.id,
        address,
        phone,
        cpf
      });

      res.status(201).json({ user, client });
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

  app.get("/api/clients/:clientId/scheduled-visits", async (req, res) => {
    try {
      const scheduledVisits = await storage.getScheduledVisitsByClientId(req.params.clientId);
      res.json({ scheduledVisits });
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

  app.post("/api/visits", uploadFields, async (req, res) => {
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
        photos: req.files && (req.files as any).photos ? (req.files as any).photos.map((file: Express.Multer.File) => file.filename) : [],
        documents: req.files && (req.files as any).documents ? (req.files as any).documents.map((file: Express.Multer.File) => file.filename) : []
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
      const scheduledVisits = await storage.getScheduledVisitsWithDetails();

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
        totalVisits: visits.length,
        monthlyVisits: monthlyVisits.length,
        scheduledVisits: scheduledVisits.length
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

  // Delete provider
  app.delete("/api/admin/providers/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      
      // Get provider to find associated user
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Prestador não encontrado" });
      }

      // Delete provider profile first
      await storage.deleteProvider(providerId);
      
      // Delete associated user
      await storage.deleteUser(provider.userId);

      res.json({ message: "Prestador excluído com sucesso" });
    } catch (error) {
      console.error('Delete provider error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reset client password
  app.post("/api/admin/clients/:clientId/reset-password", async (req, res) => {
    try {
      const { clientId } = req.params;
      
      // Get client to find associated user
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      // Reset user password to "12345"
      await storage.updateUserPassword(client.userId, "12345");

      res.json({ message: "Senha do cliente resetada para '12345'" });
    } catch (error) {
      console.error('Reset client password error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reset provider password
  app.put("/api/admin/providers/:providerId/reset-password", async (req, res) => {
    try {
      const { providerId } = req.params;
      
      // Get provider to find associated user
      const provider = await storage.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Prestador não encontrado" });
      }

      // Reset password to 123456
      await storage.updateUserPassword(provider.userId, "123456");

      res.json({ message: "Senha resetada para 123456" });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
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

  app.get("/api/admin/scheduled-visits", async (req, res) => {
    try {
      const scheduledVisits = await storage.getScheduledVisitsWithDetails();
      res.json({ scheduledVisits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark scheduled visit as completed
  app.patch("/api/scheduled-visits/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Update the scheduled visit status to completed
      await storage.updateScheduledVisitStatus(id, 'completed');
      
      res.json({ message: "Agendamento marcado como concluído" });
    } catch (error) {
      console.error('Complete scheduled visit error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/admin/materials/all-consumption", async (req, res) => {
    try {
      // Get all visits with details to access material usage
      const visits = await storage.getVisitsWithDetails();
      const materialTotals: Record<string, { totalGrams: number, visitCount: number, dates: string[] }> = {};
      
      // Process each visit to sum material usage
      for (const visit of visits) {
        try {
          const materials = await storage.getMaterialUsageByVisitId(visit.id);
          const visitDate = new Date(visit.visitDate).toISOString().split('T')[0];
          
          for (const material of materials) {
            const key = material.materialType;
            if (!materialTotals[key]) {
              materialTotals[key] = { totalGrams: 0, visitCount: 0, dates: [] };
            }
            materialTotals[key].totalGrams += Number(material.quantityGrams) || 0;
            materialTotals[key].visitCount += 1;
            if (!materialTotals[key].dates.includes(visitDate)) {
              materialTotals[key].dates.push(visitDate);
            }
          }
        } catch (materialError) {
          console.error(`Error getting materials for visit ${visit.id}:`, materialError);
        }
      }

      const consumption = Object.entries(materialTotals).map(([materialType, data]) => ({
        materialType,
        totalGrams: data.totalGrams,
        totalKilograms: Number((data.totalGrams / 1000).toFixed(3)),
        visitCount: data.visitCount,
        averagePerVisit: Number((data.totalGrams / data.visitCount).toFixed(1)),
        usageDates: data.dates.sort()
      })).sort((a, b) => b.totalKilograms - a.totalKilograms);

      console.log('Material consumption calculated:', consumption);
      res.json({ consumption });
    } catch (error) {
      console.error('Error calculating material consumption:', error);
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

  // Get wells for specific client
  app.get("/api/clients/:clientId/wells", async (req, res) => {
    try {
      const { clientId } = req.params;
      const wells = await storage.getWellsByClientId(clientId);
      res.json({ wells });
    } catch (error) {
      console.error('Get client wells error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new well
  app.post("/api/wells", async (req, res) => {
    try {
      const wellData = req.body;
      const well = await storage.createWell(wellData);
      res.status(201).json(well);
    } catch (error) {
      console.error('Create well error:', error);
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
