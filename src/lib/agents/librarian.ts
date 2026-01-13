export async function generateRepoMap(files: string[], techStack: string) {
    const prompt = `
    You are the "Librarian Agent". I will give you a list of files from a ${techStack} project.
    Your goal is to identify the 5 most important files for understanding the core logic.
    Output only a JSON array of objects: [{ path: string, importance: string, reason: string }]
    
    FILE LIST:
    ${files.join('\n')}
  `;


}