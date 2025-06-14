// src/appwrite/auth.ts

import conf from "@/conf/conf"; // Or "../conf/conf" based on structure
import { Client, Account, ID, Models } from "appwrite";

export class AuthService {
    private client: Client;
    private account: Account;

    constructor() {
        this.client = new Client()
            .setEndpoint(conf.appwriteEndpoint)
            .setProject(conf.appwriteProject);
        this.account = new Account(this.client);
    }

    async createAccount(email: string, password: string, name: string): Promise<Models.User<Models.Preferences>> {
        try {
            const user = await this.account.create(ID.unique(), email, password, name);
            await this.login(email, password); // auto-login
            return user;
        } catch (error) {
            console.error("Signup failed:", error);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<Models.Session> {
        try {
            return await this.account.createSession(email, password);
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    }

    async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
        try {
            return await this.account.get();
        } catch {
            return null;
        }
    }

    async logout(): Promise<void> {
        try {
            await this.account.deleteSessions();
        } catch (error) {
            console.error("Logout failed:", error);
            throw error;
        }
    }

    async isLoggedIn(): Promise<boolean> {
        return !!(await this.getCurrentUser());
    }
}

const authService = new AuthService();
export default authService;
