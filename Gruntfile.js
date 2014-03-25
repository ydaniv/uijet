module.exports = function (grunt) {

    grunt.initConfig({
        pkg    : grunt.file.readJSON('package.json'),
        clean  : {
            docs: ['docs']
        },
        connect: {
            docs: {
                options: {
                    port     : 8000,
                    base     : 'docs',
                    keepalive: true
                }
            }
        },
        jsdoc  : {
            dist: {
                src    : [
                    'src/uijet.js',
                    'src/widgets/',
                    'src/mixins/',
                    'src/modules/'
                ],
                jsdoc  : 'node_modules/.bin/jsdoc',
                options: {
                    configure  : './conf.json',
                    destination: 'docs'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');


    grunt.registerTask('docs', ['clean:docs', 'jsdoc:dist']);
    grunt.registerTask('rtfm', ['docs', 'connect:docs']);
};
