import {Command} from '@oclif/core'
import {readFileSync} from 'fs-extra'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

export default class Version extends Command {
  static override description = 'Display version information'

  public async run(): Promise<void> {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const packagePath = join(currentDir, '..', '..', 'package.json')

    try {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
      console.log(`brandcn v${pkg.version}`)
    } catch {
      console.log('Version not found')
    }
  }
}
