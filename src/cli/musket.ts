/**
 * The Resora CLI is built on @h3ravel/musket, which is an optional peer dependency.
 * Check that it can be loaded before running any CLI code, and exit with a clear message if not.
 */
export async function ensureMusket () {
    try {
        await import('@h3ravel/musket')
    } catch (error: any) {
        if (error?.code !== 'ERR_MODULE_NOT_FOUND' && error?.code !== 'MODULE_NOT_FOUND') throw error

        console.error([
            'The Resora CLI requires "@h3ravel/musket", which is not installed.',
            'Install it to use the CLI:',
            '',
            '  npm install -D @h3ravel/musket',
            '',
        ].join('\n'))

        process.exit(1)
    }
}
