module.exports = {
  command: 'ec2-ips',
  desc: 'List elastic IPs for the region',
  builder,
  handler
}

function builder (yargs) {
  yargs
    .option('json', {
      type: 'boolean',
      desc: 'output JSON containing extended details about each elastic IP',
      alias: 'j'
    })
    .option('quiet', {
      type: 'boolean',
      desc: 'only output IP list (no progress, summary, JSON formatting)',
      default: false,
      alias: 'q'
    })
}

async function handler ({json, quiet}) {
  const buzJson = require('@buzuli/json')
  const c = require('@buzuli/color')
  const moment = require('moment')
  const r = require('ramda')

  const age = require('../lib/age')
  const ec2 = require('../lib/aws').ec2()

  try {
    const { Addresses: ips } = await ec2.listElasticIps()
    const count = 0

    function summarize (ips) {
      return r.compose(
        r.join('\n'),
        r.map(ip => {
          const {
            PublicIp: publicIp,
            NetworkInterfaceId: nicId,
            PrivateIpAddress: privateIp,
            Tags: tags
          } = ip

          const name = ((tags || []).find(({Key: k}) => k === 'Name') || {}).Value
          const nicStr = nicId ? c.yellow(nicId) : c.grey('--')
          const pubStr = publicIp ? c.key('white').bold(publicIp) : c.grey('--')
          const nameStr = name ? c.orange(name) : c.grey('--')
          const privStr = privateIp ? `(🔒 ${c.purple(privateIp)})` : ''

          return quiet ? publicIp : `${nicStr} | ${pubStr} [${nameStr}] ${privStr}`
        })
      )(ips || [])
    }

    if (quiet) {
      console.info(json ? JSON.stringify(ips) : summarize(ips))
    } else {
      console.info(json ? buzJson(ips) : summarize(ips))
      console.info(c.green(
        `Found ${c.orange(count)} elastic IPs for region ${c.yellow(ec2.aws.region)}`
      ))
    }
  } catch (error) {
    console.error(error)
    console.error(c.red(c.emoji.inject(
      `Error listing elastic IPs in ${c.yellow(ec2.aws.region)}: details above :point_up:`
    )))
    process.exit(1)
  }
}
