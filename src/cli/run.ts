import { CliApp } from './CliApp'
import { InitCommand } from './commands/InitCommand'
import { Command, Kernel } from '@h3ravel/musket'
import { MakeResource } from './commands/MakeResource'
import logo from './logo'

const app = new CliApp()

await Kernel.init((await app.loadConfig()), {
    logo,
    name: 'Resora CLI',
    baseCommands: [
        MakeResource,
        InitCommand,
        ...(app.getConfig().extraCommands || []) as typeof Command<any>[],
    ],
    exceptionHandler (exception) {
        throw exception
    },
})
