import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { UrlClick } from './url-click.entity';

@Entity('short_urls')
export class ShortUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  alias: string;

  @Column({ type: 'varchar', length: 255 })
  longUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  topic: string;

  @ManyToOne(() => User, (user) => user.shortUrls)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UrlClick, (urlClick) => urlClick.shortUrl)
  urlClicks: UrlClick[];
}
