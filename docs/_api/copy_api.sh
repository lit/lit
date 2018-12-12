#
SRC_DIR="../../src"
TMP_DIR="tmp"

rm -rf $TMP_DIR
src_dirs=`find $SRC_DIR -type d -print`
for dir in $src_dirs; do
  new_dir=`echo $dir | sed "s|$SRC_DIR|$TMP_DIR|"`
	mkdir $new_dir
done
for ts_file in `find $SRC_DIR -name "*.ts" -print`; do
  tail +14 $ts_file > `echo $ts_file | sed "s|$SRC_DIR|$TMP_DIR|"`
done
