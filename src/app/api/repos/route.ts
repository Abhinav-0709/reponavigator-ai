import dbConnect from '@/lib/dbConnect';
import Repository from '@/models/Repository';

export async function GET() {
    await dbConnect();
    // Fetch last 20 repos, sorted by lastAnalyzed
    const repos = await Repository.find({})
        .select('name owner url status lastAnalyzed updatedAt')
        .sort({ updatedAt: -1 })
        .limit(20);
        
    return Response.json(repos);
}
