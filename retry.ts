import { runPipeline } from './src/lib/pipeline';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const episodes = await prisma.episode.findMany({
        where: { status: 'failed' }
    });

    for (const episode of episodes) {
        console.log("Retrying episode:", episode.id);

        // reset error step to generate_audio to avoid audio buffer missing error
        if (episode.errorStep === 'upload_audio') {
            await prisma.episode.update({
                where: { id: episode.id },
                data: { errorStep: 'generate_audio' }
            });
        }

        try {
            await runPipeline(episode.id);
            console.log("Completed", episode.id);
        } catch (err) {
            console.error("Failed", episode.id, err);
        }
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
