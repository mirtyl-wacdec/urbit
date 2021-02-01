/-  *resource, *group
^?
|%
::
+$  action
  $%  ::  host side
      [%create name=term =policy title=@t description=@t]
      [%remove =resource]
      ::  client side
      [%join =resource =ship]
      [%leave =resource]
  ==

::
+$  progress
  ?(%start %added final)
::
+$  final
  ?(%no-perms %strange %done)
::
+$  update
  $%  [%initial initial=(map resource progress)]
      [%progress =resource =progress]
  ==
--
