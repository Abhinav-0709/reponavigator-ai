import mongoose, { Schema, Document } from 'mongoose';

export interface IRepository extends Document {
  url: string;
  name: string;
  owner: string;
  architectureMap?: string;
  status?: string;
  lastAnalyzed?: Date;
  tokenUsage: number;
  updatedAt: Date;
}

const RepoSchema = new Schema<IRepository>({
  url: { type: String, required: true, unique: true },
  name: String,
  owner: String,
  architectureMap: String,
  status: String,
  lastAnalyzed: Date,
  tokenUsage: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Repository || mongoose.model<IRepository>('Repository', RepoSchema);