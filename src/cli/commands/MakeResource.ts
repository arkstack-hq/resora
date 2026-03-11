import { CliApp } from '../CliApp'
import { Command } from '@h3ravel/musket'

export class MakeResource extends Command<CliApp> {
    protected signature = `#create:
        {resource : Generates a new resource file.
            | {name : Name of the resource to create}
            | {--c|collection : Make a resource collection}
            | {--force : Create the resource or collection file even if it already exists.}
        }
        {collection : Create a new resource collection file.
            | {name : Name of the resource collection to create}
            | {--force : Create the resource or collection file even if it already exists.}
        }
        {all : Create both resource and collection files.
            | {prefix : prefix of the resources to create, "Admin" will create AdminResource, AdminCollection} 
            | {--force : Create the resource or collection file even if it already exists.}
        }
    `


    protected description = 'Create a new resource or resource collection file'

    async handle () {
        this.app.command = this
        let path = ''
        const name: string = this.argument('name') || this.argument('prefix')
        const action = this.dictionary.name || this.dictionary.baseCommand

        if (['resource', 'collection'].includes(action) && !name)
            return void this.error('Error: Name argument is required.')
        if (action === 'all' && !name)
            return void this.error('Error: Prefix argument is required.')

        switch (action) {
            case 'resource':
                ({ path } = this.app.makeResource(name, this.options()))
                break
            case 'collection':
                ({ path } = this.app.makeResource(name + 'Collection', this.options()))
                break
            case 'all': {
                const o1 = this.app.makeResource(name, { force: this.option('force') })
                const o2 = this.app.makeResource(name + 'Collection', {
                    collection: true, force: this.option('force')
                })
                path = `${o1.path}, ${o2.path}`
                break
            }
            default:
                this.fail(`Unknown action: ${action}`)
        }

        this.success(`Created: ${path}`)
    }
}
