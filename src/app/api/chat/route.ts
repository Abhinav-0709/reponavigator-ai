import { convertToModelMessages } from 'ai';
import dbConnect from '@/lib/dbConnect';
import Repository from '@/models/Repository';
import Message from '@/models/Message';
import { orchestrator } from '@/lib/agents/orchestrator';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const repoId = searchParams.get('repoId');
    if (!repoId) return new Response("Missing repoId", { status: 400 });

    await dbConnect();
    const messages = await Message.find({ repoId }).sort({ createdAt: 1 });
    return Response.json(messages);
}

export async function POST(req: Request) {
    const { messages, repoId, apiKeys } = await req.json();
    await dbConnect();

    const repo = await Repository.findById(repoId);
    if (!repo) return new Response("Repo not found", { status: 404 });

    // Save User Message (last one in the array)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
        let content = lastMessage.content;
        
        // Handle multi-modal messages (parts) if content is missing
        if (!content && Array.isArray(lastMessage.parts)) {
            content = lastMessage.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('');
        }

        await Message.create({
            repoId,
            role: 'user',
            content: content || "" // Fallback to empty string to pass validation if really empty, though it shouldn't be
        });
    }

    const cores = await convertToModelMessages(messages);
    
    // Use the hybrid orchestrator with onFinish callback to save AI response
    const result = await orchestrator.streamHybridResponse(cores, repo.architectureMap, async (aiText) => {
        await Message.create({
            repoId,
            role: 'assistant',
            content: aiText
        });
    }, apiKeys); // 👈 Pass apiKeys to orchestrator

    return result.toUIMessageStreamResponse();
}