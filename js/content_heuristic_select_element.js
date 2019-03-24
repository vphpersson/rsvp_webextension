(() => {
    const article_root_node = (() => {
        const node_to_tally_data = new Map();

        function evaluate_node(eval_node) {
            let num_text_nodes = 0;
            let num_one_distance_nodes = 0;

            for (const node of eval_node.childNodes) {
                evaluate_node(node);

                num_text_nodes += node.nodeType === Node.TEXT_NODE;
                num_one_distance_nodes += node_to_tally_data.get(node).num_text_nodes > 0;
            }

            node_to_tally_data.set(eval_node, {num_text_nodes, num_one_distance_nodes});
        }

        evaluate_node(document.body);

        let max_num_one_distance_nodes = 0;
        let max_node = null;
        for (const [node, tally_data] of node_to_tally_data) {
            const {num_one_distance_nodes} = tally_data;
            if (num_one_distance_nodes > max_num_one_distance_nodes) {
                max_num_one_distance_nodes = num_one_distance_nodes;
                max_node = node;
            }
        }

        return max_node;
    })();

    return {title: document.title, text: article_root_node.innerText};
})();
