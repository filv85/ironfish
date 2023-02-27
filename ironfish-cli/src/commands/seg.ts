/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import {
  Assert,
  Block,
  GENESIS_BLOCK_SEQUENCE,
  IronfishNode,
  PromiseUtils,
} from '@ironfish/sdk'
import { DecryptNoteOptions } from '@ironfish/sdk/src/workerPool/tasks/decryptNotes'
import { IronfishCommand } from '../command'
import { RemoteFlags } from '../flags'

export default class SegCommand extends IronfishCommand {
  static flags = {
    ...RemoteFlags,
  }

  node: IronfishNode | null = null

  async start(): Promise<void> {
    await this.parse(SegCommand)

    this.node = await this.sdk.node()
    await this.node.openDB()
    this.node.workerPool.start()

    const genesis = await this.node.chain.getHeaderAtSequence(GENESIS_BLOCK_SEQUENCE)
    Assert.isNotNull(genesis)

    let blocks = []

    let loops = 0
    while (true) {
      loops += 1
      console.log('Starting new loop', loops)
      const start = new Date()
      for await (const blockHash of this.node.chain.iterateToHashes(genesis)) {
        const block = await this.node.chain.getBlock(blockHash)

        if (!block) {
          console.log('invalid block', blockHash)
          continue
        }

        blocks.push(block)
        if (blocks.length >= 100) {
          console.log(
            'seq',
            blocks[0].header.sequence,
            'elapsed:',
            (new Date().getTime() - start.getTime()) / 1000,
            'seconds',
          )
          await this.verifyBlocks(blocks)
          blocks = []
        }
      }
      await this.verifyBlocks(blocks)
      blocks = []
      console.log('final time:', (new Date().getTime() - start.getTime()) / 1000)
      // break
      await PromiseUtils.sleep(2000)
    }

    this.exit(0)
  }

  async verifyBlocks(blocks: Array<Block>): Promise<void> {
    Assert.isNotNull(this.node)
    const account = this.node.wallet.getDefaultAccount()
    Assert.isNotNull(account)
    // const txTasks = []
    const noteTasks = []
    for (const { transactions } of blocks) {
      // txTasks.push(this.node.workerPool.verifyTransactions(transactions))

      const noteOptions: DecryptNoteOptions[] = []
      for (const tx of transactions) {
        for (const note of tx.notes) {
          noteOptions.push({
            serializedNote: note.serialize(),
            incomingViewKey: account.incomingViewKey,
            outgoingViewKey: account.outgoingViewKey,
            viewKey: account.viewKey,
            currentNoteIndex: 0,
            decryptForSpender: true,
          })
        }

        noteTasks.push(this.node.workerPool.decryptNotes(noteOptions))
      }
    }

    const _decryptedNotes = await Promise.all(noteTasks)

    // const results = await Promise.all(txTasks)
    // const invalidResult = results.find((f) => !f.valid)
    // if (invalidResult) {
    //   console.log('invalid result', invalidResult)
    //   this.exit(1)
    // }
  }
}
