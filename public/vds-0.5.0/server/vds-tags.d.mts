export interface VdsTags {
  /** Đổi mọi thẻ VDS (component, <vds-icon>, <vds-logo>) trong chuỗi HTML thành HTML đầy đủ. */
  expand(html: string): Promise<string>
}

/** source: thư mục bộ phát hành VDS (chứa components/, icons/, logos/), mặc định bộ phát hành chứa file này. */
export declare function createVdsTags(options?: { source?: string | URL; warn?: (message: string) => void }): VdsTags
