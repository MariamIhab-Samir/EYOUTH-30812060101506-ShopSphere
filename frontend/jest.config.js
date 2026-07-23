module.exports={
    testEnvironment:'jsdom',
    testEnvironmentOptions:{
        customExportConditions: ['']
    },
    transform:{
        '^.+\\.(js|jsx|mjs)$':'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(msw|@mswjs|@bundled-es-modules|@open-draft|rettime|strict-event-emitter|outvariant|until-async|is-node-process|headers-polyfill)/)'
    ],
    setupFiles: ['<rootDir>/jest.setup.js'],
    setupFilesAfterEnv:['@testing-library/jest-dom', '<rootDir>/jest.setup.afterEnv.js']
}