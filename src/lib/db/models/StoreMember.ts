import mongoose, { Schema, Document, Model } from 'mongoose'

export type StoreRole = 'owner' | 'admin' | 'manager' | 'support'

export interface IStoreMember extends Document {
  storeId: string
  userId: mongoose.Types.ObjectId
  role: StoreRole
  invitedBy: mongoose.Types.ObjectId | null
  inviteEmail: string
  status: 'active' | 'invited' | 'removed'
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

const StoreMemberSchema = new Schema<IStoreMember>(
  {
    storeId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    role: { type: String, enum: ['owner', 'admin', 'manager', 'support'], required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    inviteEmail: { type: String, default: '' },
    status: { type: String, enum: ['active', 'invited', 'removed'], default: 'active' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

StoreMemberSchema.index({ storeId: 1, userId: 1 }, { unique: true })
StoreMemberSchema.index({ userId: 1 })

const StoreMember: Model<IStoreMember> =
  mongoose.models.StoreMember || mongoose.model<IStoreMember>('StoreMember', StoreMemberSchema)
export default StoreMember
