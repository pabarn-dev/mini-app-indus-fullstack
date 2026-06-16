import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { AddQualityCheckUseCase } from '../../application/use-cases/add-quality-check.use-case';
import { CompleteBatchUseCase } from '../../application/use-cases/complete-batch.use-case';
import { CreateBatchUseCase } from '../../application/use-cases/create-batch.use-case';
import { GetBatchByIdUseCase } from '../../application/use-cases/get-batch-by-id.use-case';
import { ListBatchesUseCase } from '../../application/use-cases/list-batches.use-case';
import { ListQualityChecksUseCase } from '../../application/use-cases/list-quality-checks.use-case';
import { RecordBatchQuantityUseCase } from '../../application/use-cases/record-batch-quantity.use-case';
import { AddQualityCheckDto } from '../dto/add-quality-check.dto';
import { BatchResponse, toBatchResponse } from '../dto/batch.response';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { ListBatchesQuery } from '../dto/list-batches.query';
import { QualityCheckResponse, toQualityCheckResponse } from '../dto/quality-check.response';
import { RecordBatchQuantityDto } from '../dto/record-batch-quantity.dto';

@Controller('batches')
export class BatchesController {
  constructor(
    private readonly createBatch: CreateBatchUseCase,
    private readonly listBatches: ListBatchesUseCase,
    private readonly getBatchById: GetBatchByIdUseCase,
    private readonly recordBatchQuantity: RecordBatchQuantityUseCase,
    private readonly completeBatch: CompleteBatchUseCase,
    private readonly addQualityCheck: AddQualityCheckUseCase,
    private readonly listQualityChecks: ListQualityChecksUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListBatchesQuery): Promise<BatchResponse[]> {
    const batches = await this.listBatches.execute(query.productionOrderId);
    return batches.map(toBatchResponse);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BatchResponse> {
    return toBatchResponse(await this.getBatchById.execute(id));
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateBatchDto): Promise<BatchResponse> {
    const batch = await this.createBatch.execute({ productionOrderId: dto.productionOrderId });
    return toBatchResponse(batch);
  }

  @Patch(':id/quantity')
  @HttpCode(200)
  async recordQuantity(
    @Param('id') id: string,
    @Body() dto: RecordBatchQuantityDto,
  ): Promise<BatchResponse> {
    const batch = await this.recordBatchQuantity.execute({ batchId: id, quantity: dto.quantity });
    return toBatchResponse(batch);
  }

  @Post(':id/complete')
  @HttpCode(200)
  async complete(@Param('id') id: string): Promise<BatchResponse> {
    return toBatchResponse(await this.completeBatch.execute(id));
  }

  @Post(':id/quality-checks')
  @HttpCode(201)
  async addCheck(
    @Param('id') id: string,
    @Body() dto: AddQualityCheckDto,
  ): Promise<QualityCheckResponse> {
    const check = await this.addQualityCheck.execute({
      batchId: id,
      result: dto.result,
      notes: dto.notes,
    });
    return toQualityCheckResponse(check);
  }

  @Get(':id/quality-checks')
  async listChecks(@Param('id') id: string): Promise<QualityCheckResponse[]> {
    const checks = await this.listQualityChecks.execute(id);
    return checks.map(toQualityCheckResponse);
  }
}
