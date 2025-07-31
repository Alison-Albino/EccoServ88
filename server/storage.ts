import { type User, type InsertUser, type Client, type InsertClient, type Well, type InsertWell, type Provider, type InsertProvider, type Visit, type InsertVisit, type UserWithProfile, type WellWithClient, type VisitWithDetails } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private wells: Map<string, Well>;
  private providers: Map<string, Provider>;
  private visits: Map<string, Visit>;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.wells = new Map();
    this.providers = new Map();
    this.visits = new Map();
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample users
    const adminUser: User = { 
      id: 'admin-1', 
      email: 'admin@eccoserv.com', 
      password: 'admin123', 
      name: 'Administrador', 
      userType: 'admin',
      createdAt: new Date('2024-01-01')
    };
    
    const clientUser1: User = { 
      id: 'client-1', 
      email: 'joao@cliente.com', 
      password: 'cliente123', 
      name: 'João Silva', 
      userType: 'client',
      createdAt: new Date('2024-01-15')
    };
    
    const clientUser2: User = { 
      id: 'client-2', 
      email: 'maria@cliente.com', 
      password: 'cliente123', 
      name: 'Maria Oliveira', 
      userType: 'client',
      createdAt: new Date('2024-02-01')
    };
    
    const providerUser1: User = { 
      id: 'provider-1', 
      email: 'carlos@tecnico.com', 
      password: 'tecnico123', 
      name: 'Carlos Santos', 
      userType: 'provider',
      createdAt: new Date('2024-01-10')
    };
    
    const providerUser2: User = { 
      id: 'provider-2', 
      email: 'ana@tecnico.com', 
      password: 'tecnico123', 
      name: 'Ana Costa', 
      userType: 'provider',
      createdAt: new Date('2024-01-20')
    };

    // Save users
    [adminUser, clientUser1, clientUser2, providerUser1, providerUser2].forEach(user => {
      this.users.set(user.id, user);
    });

    // Create client profiles
    const client1: Client = {
      id: 'client-profile-1',
      userId: 'client-1',
      address: 'Rua das Flores, 123 - São Paulo, SP',
      phone: '(11) 98765-4321',
      createdAt: new Date('2024-01-15')
    };
    
    const client2: Client = {
      id: 'client-profile-2',
      userId: 'client-2',
      address: 'Av. Central, 456 - Rio de Janeiro, RJ',
      phone: '(21) 99876-5432',
      createdAt: new Date('2024-02-01')
    };

    this.clients.set(client1.id, client1);
    this.clients.set(client2.id, client2);

    // Create provider profiles
    const provider1: Provider = {
      id: 'provider-profile-1',
      userId: 'provider-1',
      specialties: ['Manutenção Preventiva', 'Reparo de Bombas'],
      phone: '(11) 95555-1111',
      createdAt: new Date('2024-01-10')
    };
    
    const provider2: Provider = {
      id: 'provider-profile-2',
      userId: 'provider-2',
      specialties: ['Limpeza', 'Inspeção'],
      phone: '(21) 94444-2222',
      createdAt: new Date('2024-01-20')
    };

    this.providers.set(provider1.id, provider1);
    this.providers.set(provider2.id, provider2);

    // Create wells
    const well1: Well = {
      id: 'well-1',
      clientId: 'client-profile-1',
      name: 'Poço 01 - Residencial',
      type: 'residential',
      location: 'Quintal da residência',
      status: 'active',
      createdAt: new Date('2024-01-16')
    };
    
    const well2: Well = {
      id: 'well-2',
      clientId: 'client-profile-1',
      name: 'Poço 02 - Industrial',
      type: 'industrial',
      location: 'Área da fábrica',
      status: 'maintenance',
      createdAt: new Date('2024-01-17')
    };
    
    const well3: Well = {
      id: 'well-3',
      clientId: 'client-profile-2',
      name: 'Poço Principal',
      type: 'agricultural',
      location: 'Propriedade rural',
      status: 'active',
      createdAt: new Date('2024-02-02')
    };

    this.wells.set(well1.id, well1);
    this.wells.set(well2.id, well2);
    this.wells.set(well3.id, well3);

    // Create visits
    const visit1: Visit = {
      id: 'visit-1',
      wellId: 'well-1',
      providerId: 'provider-profile-1',
      visitDate: new Date('2024-03-01'),
      serviceType: 'manutencao-preventiva',
      observations: 'Manutenção preventiva realizada. Verificação do sistema de bombeamento e limpeza dos filtros. Todas as peças estão em bom estado.',
      status: 'completed',
      photos: ['visit1_photo1.jpg', 'visit1_photo2.jpg'],
      invoiceUrl: 'https://exemplo.com/boleto/123456',
      createdAt: new Date('2024-03-01')
    };
    
    const visit2: Visit = {
      id: 'visit-2',
      wellId: 'well-2',
      providerId: 'provider-profile-2',
      visitDate: new Date('2024-03-15'),
      serviceType: 'manutencao-corretiva',
      observations: 'Reparo realizado na bomba submersível. Substituição do motor queimado e verificação da instalação elétrica.',
      status: 'completed',
      photos: ['visit2_photo1.jpg'],
      invoiceUrl: 'https://exemplo.com/boleto/789012',
      createdAt: new Date('2024-03-15')
    };
    
    const visit3: Visit = {
      id: 'visit-3',
      wellId: 'well-3',
      providerId: 'provider-profile-1',
      visitDate: new Date('2024-04-01'),
      serviceType: 'inspecao',
      observations: 'Inspeção de rotina agendada para verificação geral do sistema.',
      status: 'pending',
      photos: null,
      invoiceUrl: null,
      createdAt: new Date('2024-03-20')
    };

    this.visits.set(visit1.id, visit1);
    this.visits.set(visit2.id, visit2);
    this.visits.set(visit3.id, visit3);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getUserWithProfile(id: string): Promise<UserWithProfile | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const result: UserWithProfile = { ...user };

    if (user.userType === 'client') {
      result.client = await this.getClientByUserId(id);
    } else if (user.userType === 'provider') {
      result.provider = await this.getProviderByUserId(id);
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

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { 
      ...insertClient,
      address: insertClient.address ?? null,
      phone: insertClient.phone ?? null,
      id,
      createdAt: new Date()
    };
    this.clients.set(id, client);
    return client;
  }

  async getAllClients(): Promise<Array<Client & { user: User }>> {
    const clients = Array.from(this.clients.values());
    const result = [];
    
    for (const client of clients) {
      const user = await this.getUser(client.userId);
      if (user) {
        result.push({ ...client, user });
      }
    }
    
    return result;
  }

  // Well operations
  async getWell(id: string): Promise<Well | undefined> {
    return this.wells.get(id);
  }

  async createWell(insertWell: InsertWell): Promise<Well> {
    const id = randomUUID();
    const well: Well = { 
      ...insertWell,
      status: insertWell.status ?? 'active',
      location: insertWell.location ?? null,
      id,
      createdAt: new Date()
    };
    this.wells.set(id, well);
    return well;
  }

  async getWellsByClientId(clientId: string): Promise<Well[]> {
    return Array.from(this.wells.values()).filter(well => well.clientId === clientId);
  }

  async getWellsWithClient(): Promise<WellWithClient[]> {
    const wells = Array.from(this.wells.values());
    const result = [];
    
    for (const well of wells) {
      const client = await this.getClient(well.clientId);
      if (client) {
        const user = await this.getUser(client.userId);
        if (user) {
          result.push({ ...well, client: { ...client, user } });
        }
      }
    }
    
    return result;
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

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const id = randomUUID();
    const provider: Provider = { 
      ...insertProvider,
      phone: insertProvider.phone ?? null,
      specialties: insertProvider.specialties ?? null,
      id,
      createdAt: new Date()
    };
    this.providers.set(id, provider);
    return provider;
  }

  async getAllProviders(): Promise<Array<Provider & { user: User }>> {
    const providers = Array.from(this.providers.values());
    const result = [];
    
    for (const provider of providers) {
      const user = await this.getUser(provider.userId);
      if (user) {
        result.push({ ...provider, user });
      }
    }
    
    return result;
  }

  // Visit operations
  async getVisit(id: string): Promise<Visit | undefined> {
    return this.visits.get(id);
  }

  async createVisit(insertVisit: InsertVisit): Promise<Visit> {
    const id = randomUUID();
    const visit: Visit = { 
      ...insertVisit,
      status: insertVisit.status ?? 'pending',
      photos: insertVisit.photos ?? null,
      invoiceUrl: insertVisit.invoiceUrl ?? null,
      id,
      createdAt: new Date()
    };
    this.visits.set(id, visit);
    return visit;
  }

  async getVisitsByWellId(wellId: string): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(visit => visit.wellId === wellId);
  }

  async getVisitsByProviderId(providerId: string): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(visit => visit.providerId === providerId);
  }

  async getVisitsWithDetails(): Promise<VisitWithDetails[]> {
    const visits = Array.from(this.visits.values());
    const result = [];
    
    for (const visit of visits) {
      const well = await this.getWell(visit.wellId);
      const provider = await this.getProvider(visit.providerId);
      
      if (well && provider) {
        const client = await this.getClient(well.clientId);
        const providerUser = await this.getUser(provider.userId);
        
        if (client && providerUser) {
          const clientUser = await this.getUser(client.userId);
          if (clientUser) {
            result.push({
              ...visit,
              well: { ...well, client: { ...client, user: clientUser } },
              provider: { ...provider, user: providerUser }
            });
          }
        }
      }
    }
    
    return result.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  async getVisitsByClientId(clientId: string): Promise<VisitWithDetails[]> {
    const allVisits = await this.getVisitsWithDetails();
    return allVisits.filter(visit => visit.well.clientId === clientId);
  }

  async updateVisitStatus(id: string, status: string): Promise<void> {
    const visit = this.visits.get(id);
    if (visit) {
      this.visits.set(id, { ...visit, status });
    }
  }
}

export const storage = new MemStorage();
