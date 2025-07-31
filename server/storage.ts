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
  type UserWithProfile, 
  type WellWithClient, 
  type VisitWithDetails, 
  type InvoiceWithDetails,
  users,
  clients,
  wells,
  providers,
  visits,
  invoices
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserWithProfile(id: string): Promise<UserWithProfile | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    let profile = null;
    if (user.userType === 'client') {
      profile = await this.getClientByUserId(id);
    } else if (user.userType === 'provider') {
      profile = await this.getProviderByUserId(id);
    }

    return { ...user, profile } as UserWithProfile;
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async getAllClients(): Promise<Array<Client & { user: User }>> {
    const result = await db.select({
      id: clients.id,
      userId: clients.userId,
      address: clients.address,
      phone: clients.phone,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        userType: users.userType,
        createdAt: users.createdAt
      }
    })
    .from(clients)
    .leftJoin(users, eq(clients.userId, users.id));

    return result.map(row => ({
      ...row,
      user: row.user!
    })) as Array<Client & { user: User }>;
  }

  // Well operations
  async getWell(id: string): Promise<Well | undefined> {
    const [well] = await db.select().from(wells).where(eq(wells.id, id));
    return well;
  }

  async createWell(wellData: InsertWell): Promise<Well> {
    const [well] = await db.insert(wells).values(wellData).returning();
    return well;
  }

  async getWellsByClientId(clientId: string): Promise<Well[]> {
    return await db.select().from(wells).where(eq(wells.clientId, clientId));
  }

  async getWellsWithClient(): Promise<WellWithClient[]> {
    const result = await db.select({
      id: wells.id,
      clientId: wells.clientId,
      name: wells.name,
      location: wells.location,
      wellType: wells.wellType,
      depth: wells.depth,
      status: wells.status,
      lastMaintenanceDate: wells.lastMaintenanceDate,
      client: {
        id: clients.id,
        userId: clients.userId,
        address: clients.address,
        phone: clients.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      }
    })
    .from(wells)
    .leftJoin(clients, eq(wells.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id));

    return result.map(row => ({
      ...row,
      client: {
        ...row.client!,
        user: row.client!.user!
      }
    })) as WellWithClient[];
  }

  async updateWellStatus(id: string, status: string): Promise<void> {
    await db.update(wells).set({ status }).where(eq(wells.id, id));
  }

  // Provider operations
  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  }

  async getProviderByUserId(userId: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.userId, userId));
    return provider;
  }

  async createProvider(providerData: InsertProvider): Promise<Provider> {
    const [provider] = await db.insert(providers).values(providerData).returning();
    return provider;
  }

  async getAllProviders(): Promise<Array<Provider & { user: User }>> {
    const result = await db.select({
      id: providers.id,
      userId: providers.userId,
      specialties: providers.specialties,
      phone: providers.phone,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        userType: users.userType,
        createdAt: users.createdAt
      }
    })
    .from(providers)
    .leftJoin(users, eq(providers.userId, users.id));

    return result.map(row => ({
      ...row,
      user: row.user!
    })) as Array<Provider & { user: User }>;
  }

  // Visit operations
  async getVisit(id: string): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async createVisit(visitData: InsertVisit): Promise<Visit> {
    const [visit] = await db.insert(visits).values(visitData).returning();
    return visit;
  }

  async getVisitsByWellId(wellId: string): Promise<Visit[]> {
    return await db.select().from(visits).where(eq(visits.wellId, wellId)).orderBy(desc(visits.visitDate));
  }

  async getVisitsByProviderId(providerId: string): Promise<Visit[]> {
    return await db.select().from(visits).where(eq(visits.providerId, providerId)).orderBy(desc(visits.visitDate));
  }

  async getVisitsWithDetails(): Promise<VisitWithDetails[]> {
    const result = await db.select({
      id: visits.id,
      wellId: visits.wellId,
      providerId: visits.providerId,
      visitDate: visits.visitDate,
      observations: visits.observations,
      status: visits.status,
      photoUrl: visits.photoUrl,
      well: {
        id: wells.id,
        clientId: wells.clientId,
        name: wells.name,
        location: wells.location,
        wellType: wells.wellType,
        depth: wells.depth,
        status: wells.status,
        lastMaintenanceDate: wells.lastMaintenanceDate,
        client: {
          id: clients.id,
          userId: clients.userId,
          address: clients.address,
          phone: clients.phone,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            userType: users.userType,
            createdAt: users.createdAt
          }
        }
      },
      provider: {
        id: providers.id,
        userId: providers.userId,
        specialties: providers.specialties,
        phone: providers.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      }
    })
    .from(visits)
    .leftJoin(wells, eq(visits.wellId, wells.id))
    .leftJoin(clients, eq(wells.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))
    .leftJoin(providers, eq(visits.providerId, providers.id))
    .leftJoin(users, eq(providers.userId, users.id))
    .orderBy(desc(visits.visitDate));

    return result as VisitWithDetails[];
  }

  async getVisitsByClientId(clientId: string): Promise<VisitWithDetails[]> {
    const result = await db.select({
      id: visits.id,
      wellId: visits.wellId,
      providerId: visits.providerId,
      visitDate: visits.visitDate,
      observations: visits.observations,
      status: visits.status,
      photoUrl: visits.photoUrl,
      well: {
        id: wells.id,
        clientId: wells.clientId,
        name: wells.name,
        location: wells.location,
        wellType: wells.wellType,
        depth: wells.depth,
        status: wells.status,
        lastMaintenanceDate: wells.lastMaintenanceDate,
        client: {
          id: clients.id,
          userId: clients.userId,
          address: clients.address,
          phone: clients.phone,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            userType: users.userType,
            createdAt: users.createdAt
          }
        }
      },
      provider: {
        id: providers.id,
        userId: providers.userId,
        specialties: providers.specialties,
        phone: providers.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      }
    })
    .from(visits)
    .leftJoin(wells, eq(visits.wellId, wells.id))
    .leftJoin(clients, eq(wells.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))
    .leftJoin(providers, eq(visits.providerId, providers.id))
    .leftJoin(users, eq(providers.userId, users.id))
    .where(eq(wells.clientId, clientId))
    .orderBy(desc(visits.visitDate));

    return result as VisitWithDetails[];
  }

  async updateVisitStatus(id: string, status: string): Promise<void> {
    await db.update(visits).set({ status }).where(eq(visits.id, id));
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  }

  async getInvoicesByClientId(clientId: string): Promise<InvoiceWithDetails[]> {
    const result = await db.select({
      id: invoices.id,
      clientId: invoices.clientId,
      providerId: invoices.providerId,
      visitId: invoices.visitId,
      invoiceNumber: invoices.invoiceNumber,
      description: invoices.description,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      paymentMethod: invoices.paymentMethod,
      client: {
        id: clients.id,
        userId: clients.userId,
        address: clients.address,
        phone: clients.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      },
      provider: {
        id: providers.id,
        userId: providers.userId,
        specialties: providers.specialties,
        phone: providers.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      },
      visit: {
        id: visits.id,
        wellId: visits.wellId,
        providerId: visits.providerId,
        visitDate: visits.visitDate,
        observations: visits.observations,
        status: visits.status,
        photoUrl: visits.photoUrl,
        well: {
          id: wells.id,
          clientId: wells.clientId,
          name: wells.name,
          location: wells.location,
          wellType: wells.wellType,
          depth: wells.depth,
          status: wells.status,
          lastMaintenanceDate: wells.lastMaintenanceDate
        }
      }
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))
    .leftJoin(providers, eq(invoices.providerId, providers.id))
    .leftJoin(users, eq(providers.userId, users.id))
    .leftJoin(visits, eq(invoices.visitId, visits.id))
    .leftJoin(wells, eq(visits.wellId, wells.id))
    .where(eq(invoices.clientId, clientId))
    .orderBy(desc(invoices.issueDate));

    return result as InvoiceWithDetails[];
  }

  async getInvoicesByProviderId(providerId: string): Promise<InvoiceWithDetails[]> {
    const result = await db.select({
      id: invoices.id,
      clientId: invoices.clientId,
      providerId: invoices.providerId,
      visitId: invoices.visitId,
      invoiceNumber: invoices.invoiceNumber,
      description: invoices.description,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      paymentMethod: invoices.paymentMethod,
      client: {
        id: clients.id,
        userId: clients.userId,
        address: clients.address,
        phone: clients.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      },
      provider: {
        id: providers.id,
        userId: providers.userId,
        specialties: providers.specialties,
        phone: providers.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      },
      visit: {
        id: visits.id,
        wellId: visits.wellId,
        providerId: visits.providerId,
        visitDate: visits.visitDate,
        observations: visits.observations,
        status: visits.status,
        photoUrl: visits.photoUrl,
        well: {
          id: wells.id,
          clientId: wells.clientId,
          name: wells.name,
          location: wells.location,
          wellType: wells.wellType,
          depth: wells.depth,
          status: wells.status,
          lastMaintenanceDate: wells.lastMaintenanceDate
        }
      }
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))
    .leftJoin(providers, eq(invoices.providerId, providers.id))
    .leftJoin(users, eq(providers.userId, users.id))
    .leftJoin(visits, eq(invoices.visitId, visits.id))
    .leftJoin(wells, eq(visits.wellId, wells.id))
    .where(eq(invoices.providerId, providerId))
    .orderBy(desc(invoices.issueDate));

    return result as InvoiceWithDetails[];
  }

  async getInvoicesWithDetails(): Promise<InvoiceWithDetails[]> {
    const result = await db.select({
      id: invoices.id,
      clientId: invoices.clientId,
      providerId: invoices.providerId,
      visitId: invoices.visitId,
      invoiceNumber: invoices.invoiceNumber,
      description: invoices.description,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
      paymentMethod: invoices.paymentMethod,
      client: {
        id: clients.id,
        userId: clients.userId,
        address: clients.address,
        phone: clients.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      },
      provider: {
        id: providers.id,
        userId: providers.userId,
        specialties: providers.specialties,
        phone: providers.phone,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt
        }
      },
      visit: {
        id: visits.id,
        wellId: visits.wellId,
        providerId: visits.providerId,
        visitDate: visits.visitDate,
        observations: visits.observations,
        status: visits.status,
        photoUrl: visits.photoUrl,
        well: {
          id: wells.id,
          clientId: wells.clientId,
          name: wells.name,
          location: wells.location,
          wellType: wells.wellType,
          depth: wells.depth,
          status: wells.status,
          lastMaintenanceDate: wells.lastMaintenanceDate
        }
      }
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))
    .leftJoin(providers, eq(invoices.providerId, providers.id))
    .leftJoin(users, eq(providers.userId, users.id))
    .leftJoin(visits, eq(invoices.visitId, visits.id))
    .leftJoin(wells, eq(visits.wellId, wells.id))
    .orderBy(desc(invoices.issueDate));

    return result as InvoiceWithDetails[];
  }

  async updateInvoiceStatus(id: string, status: string): Promise<void> {
    await db.update(invoices).set({ status }).where(eq(invoices.id, id));
  }

  async markInvoiceAsSent(id: string): Promise<void> {
    await db.update(invoices).set({ status: 'sent' }).where(eq(invoices.id, id));
  }

  async markInvoiceAsPaid(id: string, paymentMethod: string): Promise<void> {
    await db.update(invoices).set({ 
      status: 'paid', 
      paidDate: new Date().toISOString(),
      paymentMethod 
    }).where(eq(invoices.id, id));
  }
}

export const storage = new DatabaseStorage();