const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
const npmMajor = Number.parseInt(process.env.npm_config_user_agent?.match(/npm\/(\d+)/)?.[1] ?? '0', 10)

const supportedNode = nodeMajor >= 22 && nodeMajor < 27 && (nodeMajor !== 22 || nodeMinor >= 18)
if (!supportedNode) {
  console.error(`RelyKit requires Node.js >=22.18 and <27; received ${process.versions.node}.`)
  process.exit(1)
}

if (npmMajor !== 0 && (npmMajor < 10 || npmMajor >= 12)) {
  console.error(`RelyKit requires npm >=10 and <12; received npm ${npmMajor}.`)
  process.exit(1)
}
