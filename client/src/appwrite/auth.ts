import conf from "../conf/conf";
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

    // Signup
    async createAccount(
        email: string,
        password: string,
        name: string
    ): Promise<Models.User<Models.Preferences>> {
        const user = await this.account.create(ID.unique(), email, password, name);
        await this.login(email, password); // optional auto-login
        return user;
    }

    // Login
    async login(email: string, password: string): Promise<Models.Session> {
        return await this.account.createSession(email, password);
    }

    // Get current user
    async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
        try {
            return await this.account.get();
        } catch {
            return null;
        }
    }

    // Logout
    async logout(): Promise<void> {
        await this.account.deleteSessions();
    }
}

const authService = new AuthService();
export default authService;
