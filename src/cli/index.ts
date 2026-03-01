#!/usr/bin/env node

import { CliApp } from './CliApp'
import { InitCommand } from './commands/InitCommand'
import { Kernel } from '@h3ravel/musket'
import { MakeResource } from './commands/MakeResource'
import logo from './logo'

const app = new CliApp()

await Kernel.init((await app.loadConfig()), {
    logo,
    name: 'Resora CLI',
    baseCommands: [
        MakeResource,
        InitCommand,
        ...app.getConfig().extraCommands || []
    ],
    exceptionHandler (exception) {
        throw exception
    },
})
