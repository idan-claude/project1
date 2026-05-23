import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICategory extends Document {
  nameHe: string
  slug: string
  description: string
  image: string
  parent: mongoose.Types.ObjectId | null
  sortOrder: number
  active: boolean
  createdAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    nameHe: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CategorySchema.index({ active: 1, sortOrder: 1 })

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)
export default Category
