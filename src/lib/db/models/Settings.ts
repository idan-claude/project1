import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISettings extends Document {
  storeId: string
  key: string
  value: Record<string, unknown>
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
  {
    storeId: { type: String, default: 'default' },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

SettingsSchema.index({ storeId: 1, key: 1 }, { unique: true })

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
export default Settings
