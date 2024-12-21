import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ShortUrl } from './short-url.entity';

@Entity('url_clicks')
export class UrlClick {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ShortUrl, (shortUrl) => shortUrl.urlClicks)
  shortUrl: ShortUrl;

  @Column({ type: 'varchar', length: 255 })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255 })
  userAgent: string;

  @Column({ type: 'varchar', length: 255 })
  osType: string;

  @Column({ type: 'varchar', length: 255 })
  deviceType: string;

  @CreateDateColumn()
  createdAt: Date;
}
