import { TransactionRunner } from '../../../../shared/application/ports/transaction-runner';

// Test double: runs the work immediately, without a real transaction.
export class ImmediateTransactionRunner implements TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
