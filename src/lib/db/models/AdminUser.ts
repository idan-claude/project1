import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAdminUser extends Document {
  email: string
  passwordHash: string
  name: string
  phone: string
  emailVerified: boolean
  status: 'active' | 'suspended' | 'pending_verification'
  createdAt: Date
  updatedAt: Date
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'suspended', 'pending_verification'], default: 'active' },
  },
  { timestamps: true }
)

const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema)
export default AdminUser
