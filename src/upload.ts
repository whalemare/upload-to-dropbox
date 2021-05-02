import { Dropbox, DropboxResponse, files } from 'dropbox'
import fetch from 'node-fetch'

export function makeUpload(
  accessToken: string
): {
  upload: (
    path: string,
    contents: Buffer,
    options: {
      mode: string
      autorename: boolean
      mute: boolean
    }
  ) => Promise<DropboxResponse<files.FileMetadata>>
} {
  const dropbox = new Dropbox({ accessToken, fetch })

  return {
    upload: async (path, contents, options) => {
      return await dropbox.filesUpload({
        path,
        contents,
        mode: getMode(options.mode),
        autorename: options.autorename,
        mute: options.mute,
      })
    },
  }
}

function getMode(mode: string): files.WriteMode {
  switch (mode) {
    case 'overwrite':
      return {
        '.tag': 'overwrite',
      }
    case 'add':
    default:
      return {
        '.tag': 'add',
      }
  }
}
