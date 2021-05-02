import globby from 'globby'
import * as core from '@actions/core'
import * as fs from 'fs'
import { join, basename } from 'path'
import { makeUpload } from './upload'
import { asBoolean, asNumber, delay, isDirectory, retry } from './utils'
import { DropboxResponseError } from 'dropbox'

const accessToken = core.getInput('dropbox_access_token')
const src = core.getInput('src')
const dest = core.getInput('dest')

const retryCount = asNumber(core.getInput('retryCount') || "3")
const retryDelay = asNumber(core.getInput('retryDelay') || "1000")

const mode = core.getInput('mode')
const autorename = asBoolean(core.getInput('autorename'))
const mute = asBoolean(core.getInput('mute'))
const multiple = asBoolean(core.getInput('multiple'))

async function run() {
  try {
    const { upload } = makeUpload(accessToken)

    if (!multiple) {
      const contents = await fs.promises.readFile(src)
      if (isDirectory(dest)) {
        const path = join(dest, basename(src))
        await upload(path, contents, { mode, autorename, mute })
        core.info(`Uploaded file 1: ${src} -> ${path}`)
      } else {
        await upload(dest, contents, { mode, autorename, mute })
        core.info(`Uploaded file 2: ${src} -> ${dest}`)
      }
    } else {
      const files = await globby(src)
      await Promise.all(
        files.map(async (file) => {
          const path = join(dest, file)
          const contents = await fs.promises.readFile(file)
          if (retryCount > 0) {
            const response = await retry(async (left) => {
              if (left < retryCount) {
                const attempt = retryCount - left
                const delayMs = retryDelay * attempt
                core.warning(`Retry #${retryCount - left}/${retryCount} for ${file}: next request after ${delayMs}ms`)
                await delay(delayMs)
              }
              return upload(path, contents, { mode, autorename, mute })
            }, retryCount)
            core.info(`Uploaded file 3: ${file} -> ${JSON.stringify(response)}`)
          } else {
            const response = await upload(path, contents, { mode, autorename, mute })
            core.info(`Uploaded file 4: ${file} -> ${JSON.stringify(response)}`)
          }
        })
      )
    }
  } catch (error) {
    if (error instanceof DropboxResponseError) {
      core.error(error.error)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    core.error(error?.error)
    core.setFailed(error)
  }
}

void run()
