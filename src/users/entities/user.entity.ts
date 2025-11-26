import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OneToMany } from 'typeorm';
import { Venta } from '../../ventas/entities/venta.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ length: 100 })
  name: string;
  @Column({ unique: true, nullable: false })
  email: string;
  @Column({ nullable: false })
  password: string;
  @Column({ default: 'user' })
  rol: string;
  @OneToMany(() => Venta, (venta) => venta.usuario)
  ventas: Venta[];
}