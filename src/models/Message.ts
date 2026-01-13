import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  repoId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  repoId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
