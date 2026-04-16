<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude(['vendor', '.phpunit.cache', 'var'])
    ->name('*.php');

$config = new PhpCsFixer\Config();

return $config
    ->setRules([
        '@PSR12' => true,
        '@PHP85Migration' => true,
        'array_syntax' => ['syntax' => 'short'],
        'ordered_imports' => [
            'sort_algorithm' => 'alpha',
            'imports_order' => ['class', 'function', 'const'],
        ],
        'no_unused_imports' => true,
        'not_operator_with_successor_space' => true,
        'phpdoc_scalar' => true,
        'unary_operator_spaces' => true,
        'binary_operator_spaces' => true,
        'blank_line_before_statement' => [
            'statements' => ['break', 'continue', 'declare', 'return', 'throw', 'try'],
        ],
        'phpdoc_single_line_var_spacing' => true,
        'phpdoc_var_without_name' => true,
        'method_argument_space' => [
            'on_multiline' => 'ensure_fully_multiline',
            'keep_multiple_spaces_after_comma' => true,
        ],
        'single_trait_insert_per_statement' => true,
        'align_multiline_comment' => true,
        'concat_space' => ['spacing' => 'one'],
        'no_extra_blank_lines' => true,
        'no_trailing_whitespace' => true,
        'single_line_comment_style' => ['comment_types' => ['hash']],
        'single_import_per_statement' => false,
        'group_import' => true,
        'multiline_whitespace_before_semicolons' => false,
        'trailing_comma_in_multiline' => [
            'elements' => ['arrays', 'arguments', 'parameters', 'match'],
        ],
        'class_attributes_separation' => [
            'elements' => [
                'property' => 'one',
                'method' => 'one',
                'const' => 'one',
            ],
        ],
    ])
    ->setFinder($finder);

