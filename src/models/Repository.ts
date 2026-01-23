import mongoose, { Schema, Document } from 'mongoose';

export interface IRepository extends Document {
  url: string;
  name: string;
  owner: string;
  languages?: Record<string, number>;
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
  languages: { type: Map, of: Number },
  architectureMap: String,
  status: String,
  lastAnalyzed: Date,
  tokenUsage: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Repository || mongoose.model<IRepository>('Repository', RepoSchema);