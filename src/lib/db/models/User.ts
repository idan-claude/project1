import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAddress {
  label: string
  street: string
  city: string
  zip: string
  isDefault: boolean
}

export interface IUser extends Document {
  storeId: string
  email: string
  passwordHash: string
  name: string
  phone: string
  addresses: IAddress[]
  role: 'customer'
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<IAddress>({
  label: { type: String, default: 'בית' },
  street: String,
  city: String,
  zip: String,
  isDefault: { type: Boolean, default: false },
})

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    addresses: [AddressSchema],
    role: { type: String, default: 'customer', enum: ['customer'] },
  },
  { timestamps: true }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export default User
