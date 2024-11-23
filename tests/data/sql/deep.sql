SELECT *
FROM properties
WHERE id in (select prop_id
             from advanced_options
             where name = "Within 2 miles of sea or river"
               and prop_id in (select prop_id
                               from advanced_options
                               where name = 'WiFi'
                                 and prop_id in (select prop_id
                                                 from advanced_options
                                                 where name = 'Walking distance to pub'
                                                   and prop_id in (select prop_id
                                                                   from advanced_options
                                                                   where name = 'Swimming pool'
                                                                     and prop_id in (select prop_id
                                                                                     from advanced_options
                                                                                     where xxx = 'Sea or River views'
                                                                                       and prop_id in (select prop_id
                                                                                                       from advanced_options
                                                                                                       where name = 'Pet friendly'
                                                                                                         and prop_id in
                                                                                                             (select prop_id
                                                                                                              from advanced_options
                                                                                                              where yyy = 'Open fire, wood burning stove or a real flame fire-place'
                                                                                                                and prop_id in
                                                                                                                    (select prop_id
                                                                                                                     from advanced_options
                                                                                                                     where name = 'Off road parking'))))))))