import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISettings extends Document {
  storeId: string
  key: string
  value: Record<string, unknown>
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
  {
    storeId: { type: String, default: 'default', index: true },
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
export default Settings
