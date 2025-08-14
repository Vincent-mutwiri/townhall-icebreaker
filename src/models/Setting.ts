import pkg from 'mongoose';
const { Schema, model, models } = pkg;

export interface ISetting extends Document {
  key: string;
  value: string;
}

const SettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, { timestamps: true });

export const Setting = models.Setting || model<ISetting>('Setting', SettingSchema);