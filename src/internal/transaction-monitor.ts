import { IdGenerator } from "./utils"

export class TransactionMonitor {
    private transactions: Map<string, Map<number, Transaction>> = new Map()

    registerTransaction(transactionId: string): number {
        const transaction = new Transaction(transactionId)
        let sharedTransactions: Map<number, Transaction>
        if (this.transactions.has(transactionId)) {
            sharedTransactions = this.transactions.get(transactionId)!
            sharedTransactions.forEach((transactionToMark) => { transactionToMark.isCancelled = true })
        } else {
            sharedTransactions = new Map()
        }

        sharedTransactions.set(transaction.helperId, transaction)
        this.transactions.set(transactionId, sharedTransactions)
        return transaction.helperId
    }

    cancelTransaction(transactionId: string) {
        this.transactions.get(transactionId)?.forEach((transaction) => { transaction.isCancelled = true })
    }

    isTransactionCancelled(transactionId: string, internalId: number): boolean {
        return this.transactions.get(transactionId)?.get(internalId)?.isCancelled ?? true
    }

    clearTransaction(transactionId: string, internalId: number) {
        const sharedTransactions: Map<number, Transaction> | undefined = this.transactions.get(transactionId)
        if (sharedTransactions) {
            if (sharedTransactions.has(internalId) && sharedTransactions.size === 1) {
                this.transactions.delete(transactionId)
            } else {
                sharedTransactions.delete(internalId)
            }
        }
    }

    clearAllTransactions() {
        this.transactions.clear()
    }
}

export class Transaction {
    readonly transactionId: string
    readonly helperId: number
    private _isCancelled: boolean = false

    get isCancelled(): boolean {
        return this._isCancelled
    }

    set isCancelled(value: boolean) {
        this._isCancelled = value
    }

    constructor(transactionId: string) {
        this.transactionId = transactionId
        this.helperId = IdGenerator.nextId()
    }
}
