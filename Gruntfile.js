module.exports = function (grunt) {

    grunt.initConfig({
        pkg    : grunt.file.readJSON('package.json'),
        clean  : {
            docs: ['docs'],
            doks: ['doks']
        },
        connect: {
            docs: {
                options: {
                    port     : 8000,
                    base     : 'docs',
                    keepalive: true
                }
            },
            doks: {
                options: {
                    port     : 8000,
                    base     : 'doks',
                    keepalive: true
                }
            }
        },
        jsdoc  : {
            dist: {
                src    : ['src/'],
                jsdoc  : 'node_modules/.bin/jsdoc',
                options: {
                    configure  : './conf.json',
                    destination: 'docs'
                }
            }
        },
        docker : {
            dist: {
                src : ['src/**/*.js'],
                dest: 'doks'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');

    /* JSDoc based docs */
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('docs', ['clean:docs', 'jsdoc']);
    grunt.registerTask('rtfm', ['docs', 'connect:docs']);

    /* Docker based docs */
    grunt.loadNpmTasks('grunt-docker');

    grunt.registerTask('doks', ['clean:doks', 'docker']);
    grunt.registerTask('rtfd', ['doks', 'connect:doks']);

};
