// client/src/lib/appwrite.ts

import { Client, Databases } from 'appwrite';
import conf from '@/conf/conf'; // make sure alias works or use relative path

const client = new Client()
    .setEndpoint(conf.appwriteEndpoint)
    .setProject(conf.appwriteProject);

export const databases = new Databases(client);
