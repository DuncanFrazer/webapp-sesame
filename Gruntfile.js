/**
 * Grunt: The JavaScript Task Runner
 */
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.initConfig({
        jshint: {
            all: ['Gruntfile.js', 'api_v1/**/*.js'],
            options: {
                esversion: 6
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                },
                src: ['test/**/*.js']
            }
        },
        eslint: {
            target: ['api_v1/**/*.js']
        }
    });

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('test', ['mochaTest', 'jshint', 'eslint']);
};