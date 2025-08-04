import { 
  type User, 
  type InsertUser, 
  type Client, 
  type InsertClient, 
  type Well, 
  type InsertWell, 
  type Provider, 
  type InsertProvider, 
  type Visit, 
  type InsertVisit, 
  type Invoice, 
  type InsertInvoice, 
  type MaterialUsage,
  type InsertMaterialUsage,
  type UserWithProfile, 
  type WellWithClient, 
  type VisitWithDetails, 
  type InvoiceWithDetails,
  type VisitWithMaterials
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserWithProfile(id: string): Promise<UserWithProfile | undefined>;

  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getClientByUserId(userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Array<Client & { user: User }>>;

  // Well operations
  getWell(id: string): Promise<Well | undefined>;
  createWell(well: InsertWell): Promise<Well>;
  getWellsByClientId(clientId: string): Promise<Well[]>;
  getWellsWithClient(): Promise<WellWithClient[]>;
  updateWellStatus(id: string, status: string): Promise<void>;

  // Provider operations
  getProvider(id: string): Promise<Provider | undefined>;
  getProviderByUserId(userId: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  getAllProviders(): Promise<Array<Provider & { user: User }>>;

  // Visit operations
  getVisit(id: string): Promise<Visit | undefined>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  getVisitsByWellId(wellId: string): Promise<Visit[]>;
  getVisitsByProviderId(providerId: string): Promise<Visit[]>;
  getVisitsWithDetails(): Promise<VisitWithDetails[]>;
  getVisitsByClientId(clientId: string): Promise<VisitWithDetails[]>;
  updateVisitStatus(id: string, status: string): Promise<void>;

  // Invoice operations
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByClientId(clientId: string): Promise<InvoiceWithDetails[]>;
  getInvoicesByProviderId(providerId: string): Promise<InvoiceWithDetails[]>;
  getInvoicesWithDetails(): Promise<InvoiceWithDetails[]>;
  updateInvoiceStatus(id: string, status: string): Promise<void>;
  markInvoiceAsSent(id: string): Promise<void>;
  markInvoiceAsPaid(id: string, paymentMethod: string): Promise<void>;

  // Material usage operations
  getMaterialUsage(id: string): Promise<MaterialUsage | undefined>;
  createMaterialUsage(materialUsage: InsertMaterialUsage): Promise<MaterialUsage>;
  getMaterialUsageByVisitId(visitId: string): Promise<MaterialUsage[]>;
  getVisitWithMaterials(visitId: string): Promise<VisitWithMaterials | undefined>;
  getMaterialConsumptionByPeriod(startDate: Date, endDate: Date): Promise<{ materialType: string; totalGrams: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private wells: Map<string, Well> = new Map();
  private providers: Map<string, Provider> = new Map();
  private visits: Map<string, Visit> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private materialUsage: Map<string, MaterialUsage> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample users
    const clientUser: User = {
      id: "client-user-1",
      name: "João Silva",
      email: "joao@cliente.com",
      password: "cliente123",
      userType: "client",
      createdAt: "2024-01-15T10:00:00Z"
    };

    const providerUser: User = {
      id: "provider-user-1", 
      name: "Carlos Santos",
      email: "carlos@tecnico.com",
      password: "tecnico123",
      userType: "provider",
      createdAt: "2024-01-10T08:00:00Z"
    };

    const adminUser: User = {
      id: "admin-user-1",
      name: "Admin Sistema",
      email: "admin@eccoserv.com", 
      password: "admin123",
      userType: "admin",
      createdAt: "2024-01-01T00:00:00Z"
    };

    this.users.set(clientUser.id, clientUser);
    this.users.set(providerUser.id, providerUser);
    this.users.set(adminUser.id, adminUser);

    // Sample client profile
    const clientProfile: Client = {
      id: "client-profile-1",
      userId: "client-user-1",
      address: "Rua das Flores, 123, São Paulo - SP",
      phone: "(11) 99999-9999"
    };
    this.clients.set(clientProfile.id, clientProfile);

    // Sample provider profile  
    const providerProfile: Provider = {
      id: "provider-profile-1",
      userId: "provider-user-1",
      specialties: ["Manutenção preventiva", "Limpeza de poços"],
      phone: "(11) 88888-8888"
    };
    this.providers.set(providerProfile.id, providerProfile);

    // Sample well
    const well: Well = {
      id: "well-1",
      clientId: "client-profile-1",
      name: "Poço Principal",
      location: "Quintal da residência",
      wellType: "residential",
      depth: 50,
      status: "active",
      lastMaintenanceDate: "2024-01-01T00:00:00Z"
    };
    this.wells.set(well.id, well);

    // Sample visit
    const visit: Visit = {
      id: "visit-1",
      wellId: "well-1",
      providerId: "provider-profile-1",
      visitDate: "2024-01-20T14:00:00Z",
      serviceType: "manutencao-preventiva",
      visitType: "periodic",
      nextVisitDate: "2024-04-20T14:00:00Z",
      observations: "Manutenção preventiva realizada. Sistema funcionando perfeitamente.",
      status: "completed",
      photos: [],
      invoiceUrl: null,
      createdAt: "2024-01-20T14:00:00Z"
    };
    this.visits.set(visit.id, visit);

    // Sample invoice
    const invoice: Invoice = {
      id: "invoice-1",
      clientId: "client-profile-1", 
      providerId: "provider-profile-1",
      visitId: "visit-1",
      invoiceNumber: "FAT-001-2024",
      description: "Manutenção preventiva - Poço Principal",
      totalAmount: "250.00",
      status: "paid",
      issueDate: "2024-01-20T00:00:00Z",
      dueDate: "2024-02-20T00:00:00Z",
      paidDate: "2024-01-25T00:00:00Z",
      paymentMethod: "pix"
    };
    this.invoices.set(invoice.id, invoice);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      ...userData,
      id: userData.id || randomUUID(),
      createdAt: userData.createdAt || new Date().toISOString()
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserWithProfile(id: string): Promise<UserWithProfile | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const result: UserWithProfile = { ...user };
    
    if (user.userType === 'client') {
      const client = Array.from(this.clients.values()).find(c => c.userId === id);
      if (client) {
        result.client = client;
      }
    } else if (user.userType === 'provider') {
      const provider = Array.from(this.providers.values()).find(p => p.userId === id);
      if (provider) {
        result.provider = provider;
      }
    }

    return result;
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client => client.userId === userId);
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const client: Client = {
      ...clientData,
      id: clientData.id || randomUUID()
    };
    this.clients.set(client.id, client);
    return client;
  }

  async getAllClients(): Promise<Array<Client & { user: User }>> {
    return Array.from(this.clients.values()).map(client => ({
      ...client,
      user: this.users.get(client.userId)!
    })).filter(item => item.user);
  }

  // Well operations
  async getWell(id: string): Promise<Well | undefined> {
    return this.wells.get(id);
  }

  async createWell(wellData: InsertWell): Promise<Well> {
    const well: Well = {
      ...wellData,
      id: wellData.id || randomUUID()
    };
    this.wells.set(well.id, well);
    return well;
  }

  async getWellsByClientId(clientId: string): Promise<Well[]> {
    return Array.from(this.wells.values()).filter(well => well.clientId === clientId);
  }

  async getWellsWithClient(): Promise<WellWithClient[]> {
    return Array.from(this.wells.values()).map(well => {
      const client = this.clients.get(well.clientId);
      const user = client ? this.users.get(client.userId) : undefined;
      return {
        ...well,
        client: client && user ? { ...client, user } : null
      };
    }).filter(item => item.client) as WellWithClient[];
  }

  async updateWellStatus(id: string, status: string): Promise<void> {
    const well = this.wells.get(id);
    if (well) {
      this.wells.set(id, { ...well, status });
    }
  }

  // Provider operations
  async getProvider(id: string): Promise<Provider | undefined> {
    return this.providers.get(id);
  }

  async getProviderByUserId(userId: string): Promise<Provider | undefined> {
    return Array.from(this.providers.values()).find(provider => provider.userId === userId);
  }

  async createProvider(providerData: InsertProvider): Promise<Provider> {
    const provider: Provider = {
      ...providerData,
      id: providerData.id || randomUUID()
    };
    this.providers.set(provider.id, provider);
    return provider;
  }

  async getAllProviders(): Promise<Array<Provider & { user: User }>> {
    return Array.from(this.providers.values()).map(provider => ({
      ...provider,
      user: this.users.get(provider.userId)!
    })).filter(item => item.user);
  }

  // Visit operations  
  async getVisit(id: string): Promise<Visit | undefined> {
    return this.visits.get(id);
  }

  async createVisit(visitData: InsertVisit): Promise<Visit> {
    const visit: Visit = {
      ...visitData,
      id: visitData.id || randomUUID()
    };
    this.visits.set(visit.id, visit);
    return visit;
  }

  async getVisitsByWellId(wellId: string): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(visit => visit.wellId === wellId);
  }

  async getVisitsByProviderId(providerId: string): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(visit => visit.providerId === providerId);
  }

  async getVisitsWithDetails(): Promise<VisitWithDetails[]> {
    return Array.from(this.visits.values()).map(visit => {
      const well = this.wells.get(visit.wellId);
      const provider = this.providers.get(visit.providerId);
      
      let wellWithClient = null;
      if (well) {
        const client = this.clients.get(well.clientId);
        const clientUser = client ? this.users.get(client.userId) : undefined;
        if (client && clientUser) {
          wellWithClient = { ...well, client: { ...client, user: clientUser } };
        }
      }

      let providerWithUser = null;
      if (provider) {
        const providerUser = this.users.get(provider.userId);
        if (providerUser) {
          providerWithUser = { ...provider, user: providerUser };
        }
      }

      return {
        ...visit,
        well: wellWithClient,
        provider: providerWithUser
      };
    }).filter(item => item.well && item.provider) as VisitWithDetails[];
  }

  async getVisitsByClientId(clientId: string): Promise<VisitWithDetails[]> {
    const clientWells = Array.from(this.wells.values()).filter(well => well.clientId === clientId);
    const wellIds = clientWells.map(well => well.id);
    
    return Array.from(this.visits.values())
      .filter(visit => wellIds.includes(visit.wellId))
      .map(visit => {
        const well = this.wells.get(visit.wellId);
        const provider = this.providers.get(visit.providerId);
        
        let wellWithClient = null;
        if (well) {
          const client = this.clients.get(well.clientId);
          const clientUser = client ? this.users.get(client.userId) : undefined;
          if (client && clientUser) {
            wellWithClient = { ...well, client: { ...client, user: clientUser } };
          }
        }

        let providerWithUser = null;
        if (provider) {
          const providerUser = this.users.get(provider.userId);
          if (providerUser) {
            providerWithUser = { ...provider, user: providerUser };
          }
        }

        return {
          ...visit,
          well: wellWithClient,
          provider: providerWithUser
        };
      }).filter(item => item.well && item.provider) as VisitWithDetails[];
  }

  async updateVisitStatus(id: string, status: string): Promise<void> {
    const visit = this.visits.get(id);
    if (visit) {
      this.visits.set(id, { ...visit, status });
    }
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const invoice: Invoice = {
      ...invoiceData,
      id: invoiceData.id || randomUUID()
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async getInvoicesByClientId(clientId: string): Promise<InvoiceWithDetails[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.clientId === clientId)
      .map(invoice => this.buildInvoiceWithDetails(invoice))
      .filter(item => item) as InvoiceWithDetails[];
  }

  async getInvoicesByProviderId(providerId: string): Promise<InvoiceWithDetails[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.providerId === providerId)
      .map(invoice => this.buildInvoiceWithDetails(invoice))
      .filter(item => item) as InvoiceWithDetails[];
  }

  async getInvoicesWithDetails(): Promise<InvoiceWithDetails[]> {
    return Array.from(this.invoices.values())
      .map(invoice => this.buildInvoiceWithDetails(invoice))
      .filter(item => item) as InvoiceWithDetails[];
  }

  private buildInvoiceWithDetails(invoice: Invoice): InvoiceWithDetails | null {
    const client = this.clients.get(invoice.clientId);
    const provider = this.providers.get(invoice.providerId);
    const visit = invoice.visitId ? this.visits.get(invoice.visitId) : null;
    
    const clientUser = client ? this.users.get(client.userId) : undefined;
    const providerUser = provider ? this.users.get(provider.userId) : undefined;
    
    if (!client || !provider || !clientUser || !providerUser) {
      return null;
    }

    let visitWithWell = null;
    if (visit) {
      const well = this.wells.get(visit.wellId);
      if (well) {
        visitWithWell = { ...visit, well };
      }
    }

    return {
      ...invoice,
      client: { ...client, user: clientUser },
      provider: { ...provider, user: providerUser },
      visit: visitWithWell
    };
  }

  async updateInvoiceStatus(id: string, status: string): Promise<void> {
    const invoice = this.invoices.get(id);
    if (invoice) {
      this.invoices.set(id, { ...invoice, status });
    }
  }

  async markInvoiceAsSent(id: string): Promise<void> {
    const invoice = this.invoices.get(id);
    if (invoice) {
      this.invoices.set(id, { ...invoice, status: 'sent' });
    }
  }

  async markInvoiceAsPaid(id: string, paymentMethod: string): Promise<void> {
    const invoice = this.invoices.get(id);
    if (invoice) {
      this.invoices.set(id, { 
        ...invoice, 
        status: 'paid', 
        paidDate: new Date().toISOString(),
        paymentMethod 
      });
    }
  }

  // Material usage operations
  async getMaterialUsage(id: string): Promise<MaterialUsage | undefined> {
    return this.materialUsage.get(id);
  }

  async createMaterialUsage(materialUsage: InsertMaterialUsage): Promise<MaterialUsage> {
    const id = randomUUID();
    const newMaterialUsage: MaterialUsage = {
      ...materialUsage,
      id,
      createdAt: new Date().toISOString(),
    };
    this.materialUsage.set(id, newMaterialUsage);
    return newMaterialUsage;
  }

  async getMaterialUsageByVisitId(visitId: string): Promise<MaterialUsage[]> {
    return Array.from(this.materialUsage.values())
      .filter(material => material.visitId === visitId);
  }

  async getVisitWithMaterials(visitId: string): Promise<VisitWithMaterials | undefined> {
    const visit = this.visits.get(visitId);
    if (!visit) return undefined;

    const well = this.wells.get(visit.wellId);
    if (!well) return undefined;

    const client = this.clients.get(well.clientId);
    const provider = this.providers.get(visit.providerId);
    
    const clientUser = client ? this.users.get(client.userId) : undefined;
    const providerUser = provider ? this.users.get(provider.userId) : undefined;
    
    if (!client || !provider || !clientUser || !providerUser) {
      return undefined;
    }

    const materials = await this.getMaterialUsageByVisitId(visitId);

    return {
      ...visit,
      well: { ...well, client: { ...client, user: clientUser } },
      provider: { ...provider, user: providerUser },
      materials
    };
  }

  async getMaterialConsumptionByPeriod(startDate: Date, endDate: Date): Promise<{ materialType: string; totalGrams: number }[]> {
    const consumption = new Map<string, number>();
    
    for (const material of this.materialUsage.values()) {
      const materialDate = new Date(material.createdAt);
      if (materialDate >= startDate && materialDate <= endDate) {
        const current = consumption.get(material.materialType) || 0;
        consumption.set(material.materialType, current + Number(material.quantityGrams));
      }
    }
    
    return Array.from(consumption.entries()).map(([materialType, totalGrams]) => ({
      materialType,
      totalGrams
    }));
  }
}

export const storage = new MemStorage();