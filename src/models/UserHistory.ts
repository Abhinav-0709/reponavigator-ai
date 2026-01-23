import mongoose, { Schema, Document } from 'mongoose';

export interface IUserHistory extends Document {
  userId: string;
  repository: mongoose.Schema.Types.ObjectId;
  lastVisited: Date;
}

const UserHistorySchema = new Schema<IUserHistory>({
  userId: { type: String, required: true, index: true },
  repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
  lastVisited: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index to ensure a user only has one entry per repo (we just update lastVisited)
UserHistorySchema.index({ userId: 1, repository: 1 }, { unique: true });

export default mongoose.models.UserHistory || mongoose.model<IUserHistory>('UserHistory', UserHistorySchema);
