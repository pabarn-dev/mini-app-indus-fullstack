import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CancelProductionOrderUseCase } from '../../application/use-cases/cancel-production-order.use-case';
import { CompleteProductionOrderUseCase } from '../../application/use-cases/complete-production-order.use-case';
import { CreateProductionOrderUseCase } from '../../application/use-cases/create-production-order.use-case';
import { GetProductionOrderByIdUseCase } from '../../application/use-cases/get-production-order-by-id.use-case';
import { ListProductionOrdersUseCase } from '../../application/use-cases/list-production-orders.use-case';
import { PlanProductionOrderUseCase } from '../../application/use-cases/plan-production-order.use-case';
import { StartProductionOrderUseCase } from '../../application/use-cases/start-production-order.use-case';
import { CreateProductionOrderDto } from '../dto/create-production-order.dto';
import {
  ProductionOrderResponse,
  toProductionOrderResponse,
} from '../dto/production-order.response';

@Controller('production-orders')
export class ProductionOrdersController {
  constructor(
    private readonly createProductionOrder: CreateProductionOrderUseCase,
    private readonly listProductionOrders: ListProductionOrdersUseCase,
    private readonly getProductionOrderById: GetProductionOrderByIdUseCase,
    private readonly planProductionOrder: PlanProductionOrderUseCase,
    private readonly startProductionOrder: StartProductionOrderUseCase,
    private readonly completeProductionOrder: CompleteProductionOrderUseCase,
    private readonly cancelProductionOrder: CancelProductionOrderUseCase,
  ) {}

  @Get()
  async list(): Promise<ProductionOrderResponse[]> {
    const orders = await this.listProductionOrders.execute();
    return orders.map(toProductionOrderResponse);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ProductionOrderResponse> {
    const order = await this.getProductionOrderById.execute(id);
    return toProductionOrderResponse(order);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateProductionOrderDto): Promise<ProductionOrderResponse> {
    const order = await this.createProductionOrder.execute({
      reference: dto.reference,
      targetQuantity: dto.targetQuantity,
      machineId: dto.machineId,
    });
    return toProductionOrderResponse(order);
  }

  @Post(':id/plan')
  @HttpCode(200)
  async plan(@Param('id') id: string): Promise<ProductionOrderResponse> {
    return toProductionOrderResponse(await this.planProductionOrder.execute(id));
  }

  @Post(':id/start')
  @HttpCode(200)
  async start(@Param('id') id: string): Promise<ProductionOrderResponse> {
    return toProductionOrderResponse(await this.startProductionOrder.execute(id));
  }

  @Post(':id/complete')
  @HttpCode(200)
  async complete(@Param('id') id: string): Promise<ProductionOrderResponse> {
    return toProductionOrderResponse(await this.completeProductionOrder.execute(id));
  }

  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(@Param('id') id: string): Promise<ProductionOrderResponse> {
    return toProductionOrderResponse(await this.cancelProductionOrder.execute(id));
  }
}
