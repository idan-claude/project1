import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISettings extends Document {
  key: string
  value: Record<string, unknown>
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

SettingsSchema.index({ key: 1 }, { unique: true })

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)
export default Settings
