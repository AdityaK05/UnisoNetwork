const conf ={
    appwriteEndpoint: String(import.meta.env.VITE_APPWRITE_ENDPOINT),
    appwriteProject: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDatabase: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteInternshipsCollection: String(import.meta.env.VITE_APPWRITE_COLLECTION_INTERNSHIPS),
    appwriteCommunityCollection: String(import.meta.env.VITE_APPWRITE_COLLECTION_COMMUNITY),
    appwriteEventsCollection: String(import.meta.env.VITE_APPWRITE_COLLECTION_EVENTS),
    appwriteTalksCollection: String(import.meta.env.VITE_APPWRITE_COLLECTION_TALKS),
    appwriteResourcesCollection: String(import.meta.env.VITE_APPWRITE_COLLECTION_RESOURCES),
    appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
}

export default conf;