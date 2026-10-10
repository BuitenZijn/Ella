/**
 * Common Components
 *
 * Shared UI components used across the application.
 */

export { EmptyState, type EmptyStateProps } from './EmptyState'
export { LoadingState } from './LoadingState'
export { StatCard, type StatCardProps } from './StatCard'
export { RoleBadge, type RoleBadgeProps, type RoleType } from './RoleBadge'
export { PageHeader, type PageHeaderProps } from './PageHeader'
export { ButtonLink, type ButtonLinkProps } from './ButtonLink'
export {
  ConfirmDialog,
  type ConfirmDialogProps,
  type ConfirmDialogVariant,
} from './ConfirmDialog'
export {
  FormField,
  TextInputField,
  type FormFieldProps,
  type TextInputFieldProps,
} from './FormField'
export {
  ImageUpload,
  type ImageUploadProps,
  type ImageUploadRef,
} from './ImageUpload'
// Types only: ImageUpload loads the crop modal (and react-image-crop with its
// CSS) on demand, and a value export here would put it on every page that
// imports this barrel.
export type { CropPreset, ImageCropModalProps } from './ImageCropModal'
